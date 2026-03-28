import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TranslatorEntry {
  oldTerm: string;
  newTerm: string;
}

const TranslatorTable = ({ entries }: { entries: TranslatorEntry[] }) => (
  <div className="rounded-lg border border-border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-primary/5">
          <TableHead className="font-display font-semibold text-foreground">What You Called It</TableHead>
          <TableHead className="font-display font-semibold text-foreground">What They Call It</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => (
          <TableRow key={i} className="hover:bg-muted/50 transition-colors">
            <TableCell className="text-muted-foreground font-body">{entry.oldTerm}</TableCell>
            <TableCell className="font-body font-medium text-foreground">{entry.newTerm}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default TranslatorTable;
