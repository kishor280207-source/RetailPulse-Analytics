import { Grid, Card, CardContent, Typography } from "@mui/material";

const cards = [
    {
        title: "Total Customers",
        value: 1250
    },
    {
        title: "Active Customers",
        value: 1180
    },
    {
        title: "New Customers",
        value: 45
    },
    {
        title: "Returning Customers",
        value: 920
    }
];

export default function CustomerCards() {

    return (

        <Grid container spacing={3} mb={3}>

            {cards.map((card) => (

                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>

                    <Card
                        elevation={3}
                        sx={{
                            borderRadius: 3,
                            height: "100%"
                        }}
                    >

                        <CardContent>

                            <Typography
                                color="text.secondary"
                                gutterBottom
                            >
                                {card.title}
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight="bold"
                            >
                                {card.value}
                            </Typography>

                        </CardContent>

                    </Card>

                </Grid>

            ))}

        </Grid>

    );

}