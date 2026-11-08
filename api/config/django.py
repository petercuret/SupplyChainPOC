"""Initialise Django so the ORM can be used from FastAPI. Import this before any model."""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
