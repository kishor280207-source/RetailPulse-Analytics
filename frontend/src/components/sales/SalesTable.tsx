import  type { Sale } from "../../types/sales";

interface Props {
    sales: Sale[];
}

const SalesTable = ({ sales }: Props) => {
    return (
        <table
            border={1}
            cellPadding={10}
            cellSpacing={0}
            style={{
                width: "100%",
                marginTop: "20px"
            }}
        >
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Sales Channel</th>
                    <th>Payment</th>
                    <th>Total Amount</th>
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

                            <td>{sale.sale_date}</td>

                            <td>{sale.sales_channel}</td>

                            <td>{sale.payment_method}</td>

                            <td>₹ {sale.total_amount}</td>

                            <td>

                                <button>
                                    View
                                </button>

                                <button
                                    style={{
                                        marginLeft: "10px"
                                    }}
                                >
                                    Edit
                                </button>

                                <button
                                    style={{
                                        marginLeft: "10px"
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