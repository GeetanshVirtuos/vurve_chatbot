from datetime import datetime
from typing import Literal

# ANSI color codes for terminal output
class COLORS:
    RED = '\x1b[31m'
    GREEN = '\x1b[32m'
    YELLOW = '\x1b[33m'
    ORANGE = '\x1b[38;5;208m'
    RESET = '\x1b[0m'

# Log types
class LOG_TYPES:
    SUCCESS = 'success'
    ERROR = 'error'
    INFORMATION = 'information'
    WARNING = 'warning'

def logger(text: str, log_type: Literal['success', 'error', 'information', 'warning']) -> None:
    """
    Centralized logger function for the entire project
    
    Args:
        text (str): The text to be logged
        log_type (str): The type of log (success, error, information, or warning)
    """
    timestamp = datetime.now().isoformat()
    
    if log_type == LOG_TYPES.SUCCESS:
        print(f"{COLORS.GREEN}SUCCESS:{COLORS.RESET} {text}")
    elif log_type == LOG_TYPES.ERROR:
        print(f"{COLORS.RED}ERROR:{COLORS.RESET} {text}")
    elif log_type == LOG_TYPES.INFORMATION:
        print(f"{COLORS.ORANGE}INFORMATION:{COLORS.RESET} {text}")
    elif log_type == LOG_TYPES.WARNING:
        print(f"{COLORS.YELLOW}WARNING:{COLORS.RESET} {text}")
    else:
        print(f"UNKNOWN LOG TYPE: {text}")

# Example usage
if __name__ == "__main__":
    logger('Logger initialized', LOG_TYPES.SUCCESS)
    # logger('This is a test error message', LOG_TYPES.ERROR)
    # logger('This is some informational message', LOG_TYPES.INFORMATION)
    # logger('This is a warning message', LOG_TYPES.WARNING)