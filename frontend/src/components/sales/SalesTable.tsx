import type { Sale } from "../../types/sales";
import { useNavigate } from "react-router-dom";
import { deleteSale } from "../../api/salesApi";

interface Props {
  sales: Sale[];
}

const SalesTable = ({ sales }: Props) => {
    const navigate = useNavigate();
const handleDelete = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this sale?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteSale(id);

    alert("Sale deleted successfully.");

    window.location.reload();
  } catch (error) {
    console.error(error);
    alert("Failed to delete sale.");
  }
};
  return (
    <table
      border={1}
      cellPadding={10}
      cellSpacing={0}
      style={{
        width: "100%",
        marginTop: "20px",
      }}
    >
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Date</th>
          <th>Payment</th>
          <th>Total Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {sales.length === 0 ? (
          <tr>
            <td colSpan={7} align="center">
              No Sales Found
            </td>
          </tr>
        ) : (
          sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.invoice_number}</td>

              <td>{sale.customer_name}</td>

              <td>
                {sale.sale_date
                  ? new Date(sale.sale_date).toLocaleDateString()
                  : "-"}
              </td>

              <td>{sale.payment_method}</td>

              <td>₹ {sale.total_amount ?? 0}</td>

              <td>{sale.status ?? "Completed"}</td>

              <td>
                <button
                   onClick={() => navigate(`/sales/${sale.id}`)}
                >
                    View
                </button>
                
                <button
                   style={{
                      marginLeft: "10px"
                    }}
                    onClick={() => navigate(`/sales/edit/${sale.id}`)}
                    >
                    Edit
                </button>

                <button
                   style={{
                     marginLeft: "10px"
                    }}
                    onClick={() => {
                     if (sale.id) {
                       handleDelete(sale.id);
                      }
                    }}
                >
                    Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default SalesTable;