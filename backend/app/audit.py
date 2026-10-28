"""Forensic audit logger setup for GhostTrace."""

import logging
import sys

logger = logging.getLogger("ghosttrace")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [GhostTrace:%(name)s]: %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

