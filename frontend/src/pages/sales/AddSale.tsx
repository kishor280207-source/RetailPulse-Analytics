import SalesForm from "../../components/sales/SalesForm";
import { useNavigate } from "react-router-dom";
const AddSale = () => {
    const navigate = useNavigate();
    
    return (

        <div style={{ padding: "20px" }}>

            <SalesForm />

        </div>
        

    );


};

export default AddSale;