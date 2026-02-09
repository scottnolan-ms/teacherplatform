interface StubProps {
  page: string;
}

export default function Stub({ page }: StubProps) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>{page}</h1>
        <p>This page is a stub for the prototype.</p>
      </div>
    </div>
  );
}
