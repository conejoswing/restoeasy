import TableDetailClient from './TableDetailClient';

export async function generateStaticParams() {
  const tableIds = ['delivery', 'mesón'];
  for (let i = 1; i <= 10; i++) {
    tableIds.push(i.toString());
  }

  return tableIds.map(id => ({
    tableId: id,
  }));
}

interface TableDetailPageProps {
  params: {
    tableId: string;
  };
}

export default function TableDetailPage({ params }: TableDetailPageProps) {
  return (
    <TableDetailClient tableId={params.tableId} />
  );
}
