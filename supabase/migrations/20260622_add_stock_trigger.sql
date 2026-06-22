-- 1. Create a secure trigger function to decrement product stock
CREATE OR REPLACE FUNCTION public.handle_order_payment_success()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to bypass RLS on the products table
AS $$
BEGIN
    -- Check if status changed to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
        -- Decrement stock for each item in the paid order
        UPDATE public.products p
        SET stock = GREATEST(0, p.stock - oi.quantity)
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Bind the trigger to the orders table
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_payment_success();
