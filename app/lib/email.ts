import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!);

interface OrderData {
  orderId: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: string;
  deliveryAddress?: string;
  cityName?: string;
  cityState?: string;
  trailerName?: string;
  trailerAddress?: string;
  comment?: string;
  createdAt: number;
}

interface UserData {
  fullName: string;
  email: string;
  mobileNumber: string;
}

export const sendOrderNotificationEmail = async (order: OrderData, userData: UserData) => {
  try {
    // Format items as a simple string with bullet points
    const itemsList = order.items.map(item => 
      `• ${item.quantity} x ${item.foodName} (${item.selectedSize}) - $${item.totalPrice}`
    ).join('\n');

    const templateParams = {
      order_id: order.orderId.slice(-8),
      customer_name: userData.fullName,
      items: itemsList,
      total: `$${order.total.toFixed(2)}`,
      order_link: `https://food-app-admin-zeta.vercel.app/orders`
    };

    console.log('Sending email with params:', templateParams);

    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};