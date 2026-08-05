from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.demand_forecast import DemandForecast
from app.models.notification import Notification
from app.models.inventory import Inventory
from app.services.audit_service import create_audit_log
def generate_forecast(db: Session, days: int = 30):

    forecasts = []

    products = db.query(Product).all()

    for product in products:

        total_sales = (
            db.query(func.sum(SaleItem.quantity))
            .filter(SaleItem.product_id == product.id)
            .scalar()
        ) or 0

        predicted = round(total_sales * 1.10, 2)

        if predicted == 0:
            confidence = 100
        else:
            error = abs(predicted - total_sales)
            confidence = round(
                max(0, 100 - ((error / predicted) * 100)), 2
            )

        forecast = DemandForecast(
            company_id=product.company_id,
            product_id=product.id,
            category_id=product.category_id,
            forecast_period=f"Next {days} Days",
            predicted_demand=predicted,
            confidence_score=confidence,
        )

        db.add(forecast)
        forecasts.append(forecast)

        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == product.id)
            .first()
        )
        print("Product:", product.name)
        print("Total Sales:", total_sales)
        print("Predicted:", predicted)
        print("Current Stock:", inventory.current_stock if inventory else "No Inventory")

        if inventory and predicted > inventory.current_stock:

            notification = Notification(
                company_id=product.company_id,
                title="Low Stock Forecast",
                message=f"{product.name} is predicted to run out of stock."
            )

            db.add(notification)

    db.commit()

    create_audit_log(
        db=db,
        company="RetailPulse",
        user="Admin",
        action="Generated Demand Forecast",
        ip="127.0.0.1",
        browser="Chrome",
    )

    return forecasts

def get_forecasts(
    db: Session,
    company_id: int = 1
):

    return (
        db.query(DemandForecast)
        .filter(
            DemandForecast.company_id == company_id
        )
        .order_by(DemandForecast.id.desc())
        .all()
    )

def get_inventory_recommendations(db: Session):

    return [
        {
            "product": "Laptop",
            "status": "Reorder Soon"
        },
        {
            "product": "Keyboard",
            "status": "Healthy Stock"
        },
        {
            "product": "Mouse",
            "status": "Immediate Restock Required"
        },
        {
            "product": "Monitor",
            "status": "Overstock Risk"
        }
    ]