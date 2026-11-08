# Django ORM models live here. Run `just api-makemigrations` after changing them.
"""The supply chain as a generic graph.

Everything is a Node (organization, facility or item) connected by typed Edges. Edges point from
the dependent to its dependency (toy -> part -> factory -> supplier), so exposure is a reverse
traversal from a flagged node. Incidents can be attached to any node.
"""

from collections.abc import Iterable

from django.db import models


class Node(models.Model):
    class Kind(models.TextChoices):
        ORGANIZATION = "organization"
        FACILITY = "facility"
        ITEM = "item"

    kind = models.CharField(max_length=32, choices=Kind)
    # organization: finisher | supplier | basic_materials | retailer
    # facility: factory      item: product | part | material
    role = models.CharField(max_length=32)
    external_id = models.CharField(max_length=64)
    # Tenant scope: the finisher a product belongs to. Shared nodes (suppliers, parts) have none.
    owner = models.ForeignKey(
        "self", null=True, blank=True, related_name="owned", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    attrs = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "kind", "external_id"],
                name="unique_node_per_owner",
                nulls_distinct=False,
            )
        ]
        indexes = [models.Index(fields=["kind", "role"])]

    def __str__(self) -> str:
        return f"{self.role}:{self.external_id} {self.name}"


class Edge(models.Model):
    class Kind(models.TextChoices):
        CONTAINS = "contains"  # item -> item (toy -> part, part -> material)
        MADE_AT = "made_at"  # item -> facility
        OPERATED_BY = "operated_by"  # facility -> organization

    kind = models.CharField(max_length=32, choices=Kind)
    source = models.ForeignKey(Node, related_name="out_edges", on_delete=models.CASCADE)
    target = models.ForeignKey(Node, related_name="in_edges", on_delete=models.CASCADE)
    attrs = models.JSONField(default=dict, blank=True)  # contains: quantity; made_at: unit cost

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["kind", "source", "target"], name="unique_edge")
        ]
        indexes = [
            models.Index(fields=["target", "kind"]),
            models.Index(fields=["source", "kind"]),
        ]


class Incident(models.Model):
    class Severity(models.TextChoices):
        LOW = "low"
        MEDIUM = "medium"
        HIGH = "high"
        CRITICAL = "critical"

    class Status(models.TextChoices):
        OPEN = "open"  # counts toward exposure
        RESOLVED = "resolved"  # remediated, kept for history
        DISMISSED = "dismissed"  # false positive, kept for audit

    node = models.ForeignKey(Node, related_name="incidents", on_delete=models.CASCADE)
    type = models.CharField(max_length=64)  # free string, normalized: "child_labor"
    severity = models.CharField(max_length=16, choices=Severity, default=Severity.HIGH)
    status = models.CharField(max_length=16, choices=Status, default=Status.OPEN)
    description = models.TextField(blank=True)
    reported_at = models.DateField()
    resolved_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["status", "type"])]


SEVERITY_RANK = {s: i for i, s in enumerate(Incident.Severity.values, start=1)}


def worst_severity(severities: Iterable[str]) -> str | None:
    """The most severe of `severities` (low < medium < high < critical), or None if empty."""
    return max(severities, key=SEVERITY_RANK.__getitem__, default=None)
