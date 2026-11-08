import Business from "@mui/icons-material/Business";
import Category from "@mui/icons-material/Category";
import Extension from "@mui/icons-material/Extension";
import Factory from "@mui/icons-material/Factory";
import Toys from "@mui/icons-material/Toys";
import type { SvgIconComponent } from "@mui/icons-material";
import { blueGrey, brown, deepPurple, indigo, teal } from "@mui/material/colors";

import type { GraphNode } from "@/lib/types";

export type RoleStyle = { label: string; plural: string; color: string; Icon: SvgIconComponent };

/** One color + icon per node role, shared by the sidebar, tables and graph view. */
export const ROLE_STYLES: Record<string, RoleStyle> = {
  product: { label: "Toy", plural: "Toys", color: indigo[500], Icon: Toys },
  part: { label: "Part", plural: "Parts", color: blueGrey[500], Icon: Extension },
  material: { label: "Material", plural: "Materials", color: brown[400], Icon: Category },
  factory: { label: "Factory", plural: "Factories", color: teal[600], Icon: Factory },
  supplier: { label: "Supplier", plural: "Suppliers", color: deepPurple[400], Icon: Business },
};

const FALLBACK: RoleStyle = {
  label: "Node",
  plural: "Nodes",
  color: blueGrey[300],
  Icon: Category,
};

export function styleFor(node: Pick<GraphNode, "role">): RoleStyle {
  return ROLE_STYLES[node.role] ?? { ...FALLBACK, label: node.role };
}
