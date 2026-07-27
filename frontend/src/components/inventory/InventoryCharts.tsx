interface Props {
    categoryChart: any[];
    stockChart: any[];
}

const InventoryCharts = ({
    categoryChart,
    stockChart
}: Props) => {

    return (

        <div style={{ marginTop: "30px" }}>

            <h2>Inventory by Category</h2>

            <pre>
                {JSON.stringify(categoryChart, null, 2)}
            </pre>

            <h2>Stock Status Distribution</h2>

            <pre>
                {JSON.stringify(stockChart, null, 2)}
            </pre>

        </div>

    );

};

export default InventoryCharts;