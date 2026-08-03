import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  LinearProgress,
} from "@mui/material";

const products = [
  {
    name: "Laptop",
    sales: 95,
  },
  {
    name: "Keyboard",
    sales: 82,
  },
  {
    name: "Mouse",
    sales: 70,
  },
  {
    name: "Printer",
    sales: 55,
  },
];

export default function TopProducts() {
  return (
    <Card
        sx={{
          borderRadius: 4,
          height: 420,
         }}
    >
      <CardContent>

        <Typography variant="h6" mb={2}>
          Top Selling Products
        </Typography>

        {products.map((product) => (

          <ListItem
            key={product.name}
            sx={{
              display: "block",
            }}
          >

            <Typography mb={1}>
              {product.name}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={product.sales}
              sx={{
                height: 8,
                borderRadius: 5,
              }}
            />

          </ListItem>

        ))}

      </CardContent>
    </Card>
  );
}