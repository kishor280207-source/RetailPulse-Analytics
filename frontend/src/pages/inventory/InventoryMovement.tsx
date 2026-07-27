import { useEffect, useState } from "react";
import { getInventoryMovements } from "../../api/inventoryApi";

interface Movement {
    id: number;
    movement_type: string;
    previous_quantity: number;
    updated_quantity: number;
    quantity_changed: number;
    reason: string;
    remarks: string;
    performed_by: string;
    created_at: string;
}

const InventoryMovement = () => {

    const [movements, setMovements] = useState<Movement[]>([]);

    useEffect(() => {

        loadMovements();

    }, []);

    const loadMovements = async () => {

        try {

            const response =
                await getInventoryMovements();

            setMovements(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    return (

        <div style={{ padding: "20px" }}>

            <h1>Inventory Movement History</h1>

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

                        <th>Type</th>
                        <th>Previous</th>
                        <th>Updated</th>
                        <th>Changed</th>
                        <th>Reason</th>
                        <th>User</th>
                        <th>Date</th>

                    </tr>

                </thead>

                <tbody>

                    {
                        movements.map((item) => (

                            <tr key={item.id}>

                                <td>{item.movement_type}</td>

                                <td>{item.previous_quantity}</td>

                                <td>{item.updated_quantity}</td>

                                <td>{item.quantity_changed}</td>

                                <td>{item.reason}</td>

                                <td>{item.performed_by}</td>

                                <td>{item.created_at}</td>

                            </tr>

                        ))
                    }

                </tbody>

            </table>

        </div>

    );

};

export default InventoryMovement;