import type { Inventory } from "../../types/inventory";

interface Props {
    inventory: Inventory[];
}

const InventoryTable = ({ inventory }: Props) => {

    return (

        <table
            border={1}
            cellPadding={10}
            style={{
                width: "100%",
                borderCollapse: "collapse"
            }}
        >

            <thead>

                <tr>

                    <th>Product ID</th>
                    <th>Current Stock</th>
                    <th>Reserved Stock</th>
                    <th>Available Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>

                </tr>

            </thead>

            <tbody>

                {
                    inventory.map((item) => (

                        <tr key={item.id}>

                            <td>{item.product_id}</td>

                            <td>{item.current_stock}</td>

                            <td>{item.reserved_stock}</td>

                            <td>{item.available_stock}</td>

                            <td>{item.reorder_level}</td>

                            <td>{item.stock_status}</td>

                        </tr>

                    ))
                }

            </tbody>

        </table>

    );
};

export default InventoryTable;