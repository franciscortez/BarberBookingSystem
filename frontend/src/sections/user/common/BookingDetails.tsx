const BookingDetails = ({
  rows,
}: {
  rows: { label: string; value: string }[];
}) => (
  <dl className="task-details">
    {rows.map((row) => (
      <div className="task-detail" key={row.label}>
        <dt>{row.label}</dt>
        <dd>{row.value}</dd>
      </div>
    ))}
  </dl>
);
export default BookingDetails;
