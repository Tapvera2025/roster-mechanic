import Badge from "../ui/Badge";

export default function ClientRow({ client, onClientClick }) {
  const handleClick = () => {
    if (onClientClick) {
      onClientClick(client);
    }
  };

  return (
    <tr className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] z-[5]">
        <input
          type="checkbox"
          className="rounded border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
        />
      </td>

      <td
        className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-primary,220_90%_56%))] hover:underline cursor-pointer whitespace-nowrap"
        onClick={handleClick}
      >
        {client.clientName}
      </td>

      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
        {client.state}
      </td>

      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
        {client.invoicingCompany}
      </td>

      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={client.status} />
      </td>

      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
        {client.invoiceSubject}
      </td>

      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
        {client.invoiceTemplate}
      </td>
    </tr>
  );
}
