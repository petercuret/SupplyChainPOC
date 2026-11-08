from django.core.management.base import BaseCommand

from core.importer import import_seed


class Command(BaseCommand):
    help = "Import the seed CSVs into the graph (idempotent)."

    def handle(self, *args: object, **options: object) -> None:
        counts = import_seed()
        self.stdout.write(f"Imported {counts['nodes']} nodes and {counts['edges']} edges")
