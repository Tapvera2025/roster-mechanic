import Badge from "../ui/Badge";

export default function ClientRow({ client }) {
  return (
    <tr className="hover:bg-[hsl(220,15%,16%)] transition-colors border-b border-[hsl(220,15%,20%)]">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] z-[5]">
        <input
          type="checkbox"
          className="rounded border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
        />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-orange-500 hover:text-orange-400 hover:underline cursor-pointer whitespace-nowrap transition-colors">
        {client.clientName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {client.state}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {client.invoicingCompany}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={client.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {client.invoiceSubject}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {client.invoiceTemplate}
      </td>
    </tr>
  );
}
