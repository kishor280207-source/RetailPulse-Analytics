import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText
} from "@mui/material";

export default function NotificationPanel() {

    const notifications = [

        "Low Stock Alert : Rice",

        "Out of Stock : Sugar",

        "New Order Received",

        "Inventory Updated"

    ];

    return (

        <Paper sx={{ p: 3, mt: 4 }}>

            <Typography
                variant="h6"
                mb={2}
            >
                Notifications
            </Typography>

            <List>

                {notifications.map((item, index) => (

                    <ListItem key={index}>

                        <ListItemText
                            primary={item}
                        />

                    </ListItem>

                ))}

            </List>

        </Paper>

    );

}