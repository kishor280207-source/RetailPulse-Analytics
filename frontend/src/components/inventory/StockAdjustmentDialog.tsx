import { useState } from "react";

interface Props {
    inventoryId: number;
    onAddStock: (id: number, quantity: number, reason: string) => void;
    onRemoveStock: (id: number, quantity: number, reason: string) => void;
}

const StockAdjustmentDialog = ({
    inventoryId,
    onAddStock,
    onRemoveStock
}: Props) => {

    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState("");

    return (

        <div
            style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginTop: "20px",
                borderRadius: "8px"
            }}
        >

            <h3>Stock Adjustment</h3>

            <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) =>
                    setQuantity(Number(e.target.value))
                }
            />

            <br /><br />

            <input
                type="text"
                placeholder="Reason"
                value={reason}
                onChange={(e) =>
                    setReason(e.target.value)
                }
            />

            <br /><br />

            <button
                onClick={() =>
                    onAddStock(
                        inventoryId,
                        quantity,
                        reason
                    )
                }
            >
                Add Stock
            </button>

            <button
                style={{ marginLeft: "10px" }}
                onClick={() =>
                    onRemoveStock(
                        inventoryId,
                        quantity,
                        reason
                    )
                }
            >
                Remove Stock
            </button>

        </div>

    );

};

export default StockAdjustmentDialog;