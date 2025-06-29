"""Logging utilities for Sampler Bench."""

import os
import sys
import logging
from pathlib import Path
from typing import Optional
from rich.console import Console
from rich.logging import RichHandler
from rich.traceback import install as install_rich_traceback
from datetime import datetime


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels."""
    
    grey = "\x1b[38;21m"
    blue = "\x1b[34m"
    yellow = "\x1b[33m"
    red = "\x1b[31m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    
    COLORS = {
        logging.DEBUG: grey,
        logging.INFO: blue,
        logging.WARNING: yellow,
        logging.ERROR: red,
        logging.CRITICAL: bold_red
    }
    
    def format(self, record):
        log_color = self.COLORS.get(record.levelno)
        if log_color:
            record.levelname = f"{log_color}{record.levelname}{self.reset}"
        return super().format(record)


def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    use_rich: bool = True,
    structured: bool = False
) -> None:
    """Set up logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file to write logs to
        use_rich: Whether to use rich formatting for console output
        structured: Whether to use structured JSON logging
    """
    # Install rich traceback handler
    if use_rich:
        install_rich_traceback()
    
    # Create logs directory if logging to file
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    if use_rich:
        console_handler = RichHandler(
            console=Console(stderr=True),
            show_time=True,
            show_level=True,
            show_path=True,
            rich_tracebacks=True
        )
        console_format = "%(message)s"
    else:
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setFormatter(ColoredFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
    
    console_handler.setLevel(getattr(logging, level.upper()))
    root_logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        if structured:
            # JSON structured logging for files
            import json
            import time
            
            class JSONFormatter(logging.Formatter):
                def format(self, record):
                    log_entry = {
                        'timestamp': time.time(),
                        'datetime': datetime.fromtimestamp(record.created).isoformat(),
                        'level': record.levelname,
                        'logger': record.name,
                        'message': record.getMessage(),
                        'module': record.module,
                        'function': record.funcName,
                        'line': record.lineno
                    }
                    if record.exc_info:
                        log_entry['exception'] = self.formatException(record.exc_info)
                    return json.dumps(log_entry)
            
            file_handler.setFormatter(JSONFormatter())
        else:
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
            ))
        
        file_handler.setLevel(logging.DEBUG)  # Always capture all levels in file
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name."""
    return logging.getLogger(name)


class ExperimentLogger:
    """Specialized logger for experiment tracking."""
    
    def __init__(self, experiment_name: str, output_dir: str):
        self.experiment_name = experiment_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create experiment-specific log file
        log_file = self.output_dir / f"{experiment_name}.log"
        self.logger = logging.getLogger(f"experiment.{experiment_name}")
        
        # Add file handler for this experiment
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)
        
        # Track experiment metadata
        self.start_time = datetime.now()
        self.sample_count = 0
        self.error_count = 0
        
    def log_start(self, config: dict):
        """Log experiment start with configuration."""
        self.logger.info(f"Starting experiment: {self.experiment_name}")
        self.logger.info(f"Configuration: {config}")
        
    def log_sample(self, model: str, sampler: str, task: str, sample_id: str, success: bool = True):
        """Log individual sample generation."""
        self.sample_count += 1
        if not success:
            self.error_count += 1
            
        self.logger.info(
            f"Sample {sample_id} - Model: {model}, Sampler: {sampler}, Task: {task}, Success: {success}"
        )
        
    def log_evaluation(self, sample_id: str, scores: dict):
        """Log evaluation results for a sample."""
        self.logger.info(f"Evaluation {sample_id} - Scores: {scores}")
        
    def log_completion(self):
        """Log experiment completion with summary statistics."""
        duration = datetime.now() - self.start_time
        success_rate = (self.sample_count - self.error_count) / self.sample_count if self.sample_count > 0 else 0
        
        self.logger.info(f"Experiment completed: {self.experiment_name}")
        self.logger.info(f"Duration: {duration}")
        self.logger.info(f"Total samples: {self.sample_count}")
        self.logger.info(f"Errors: {self.error_count}")
        self.logger.info(f"Success rate: {success_rate:.2%}")


# Default setup
setup_logging()
logger = get_logger(__name__) 