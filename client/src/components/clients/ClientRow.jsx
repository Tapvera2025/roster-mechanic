import Badge from "../ui/Badge";

export default function ClientRow({ client, onClientClick }) {
  const handleClick = () => {
    if (onClientClick) {
      onClientClick(client);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-[5]">
        <input type="checkbox" className="rounded border-gray-300" />
      </td>
      <td
        className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
        onClick={handleClick}
      >
        {client.clientName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{client.state}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{client.invoicingCompany}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={client.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{client.invoiceSubject}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{client.invoiceTemplate}</td>
    </tr>
  );
}
