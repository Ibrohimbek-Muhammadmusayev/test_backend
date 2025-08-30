// controllers/orderController.js
const asyncHandler = require('express-async-handler');
const { User, Order, Product, ProductVariant, OrderItem, Notification } = require('../models');
const { sendNotificationToUser } = require('../utils/notification');
const smsService = require('../utils/smsService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
const createOrder = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, currency, language } = req.body;
    console.log("Creating order with payment method:", paymentMethod);
    
    // Get user preferences if not provided
    const user = await User.findByPk(req.user.id);
    const orderCurrency = currency || user.preferredCurrency || 'UZS';
    const orderLanguage = language || user.preferredLanguage || 'uz';
    
    // To'lov usulini validatsiya qilish
    const validPaymentMethods = ['cash', 'card', 'online'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        res.status(400);
        throw new Error(`Invalid payment method. Valid options: ${validPaymentMethods.join(', ')}`);
    }

    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error("No order items.");
    }

    // Har bir variantni tekshirish va stokni kamaytirish
    const itemsWithSellerInfo = await Promise.all(
        orderItems.map(async (item) => {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.productId}`);
            }

            const variant = await ProductVariant.findByPk(item.variant);
            if (!variant || variant.productId !== product.id) {
                res.status(404);
                throw new Error(`Variant not found for product: ${product.name}`);
            }

            if (variant.countInStock < item.qty) {
                res.status(400);
                throw new Error(
                    `Not enough stock for variant (size: ${variant.size}, color: ${variant.color}). Only ${variant.countInStock} available.`
                );
            }

            // Stokni kamaytirish
            variant.countInStock -= item.qty;
            await variant.save();

            // ⚡ Narxni tekshirish (agar null bo‘lsa 0 qilamiz)
            const price = Number(variant.discountPrice ?? variant.price ?? 0);

            return {
                productId: product.id,
                variantId: variant.id,
                sellerId: product.userId,
                qty: item.qty,
                price
            };
        })
    );

    // totalPrice ni hisoblash
    let totalPrice = itemsWithSellerInfo.reduce(
        (acc, item) => acc + (Number(item.price) * Number(item.qty)),
        0
    );

    // ⚡ Himoya (agar NaN yoki null bo‘lsa, 0 qilib qo‘yamiz)
    if (!totalPrice || isNaN(totalPrice)) {
        totalPrice = 0;
    }

    // To'lov usuli bo'yicha buyurtma holatini belgilash
    let initialStatus = "pending";
    let isPaidInitially = false;
    
    // Online to'lov uchun darhol to'langan deb belgilaymiz (demo uchun)
    if (paymentMethod === 'online') {
        isPaidInitially = true;
        initialStatus = "processing";
    }

    // Get currency exchange rate
    const Currency = require('../models/Currency');
    const orderCurrencyObj = await Currency.findByPk(orderCurrency);
    const exchangeRate = orderCurrencyObj ? orderCurrencyObj.rate : 1.0;
    
    // Calculate base currency total (UZS)
    const baseCurrencyTotalPrice = orderCurrency === 'UZS' ? totalPrice : totalPrice / exchangeRate;
    
    // Buyurtma yaratish
    const order = await Order.create({
        userId: req.user.id,
        currency: orderCurrency,
        language: orderLanguage,
        exchangeRate: exchangeRate,
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "{}", // ⚡ null bo'lsa string qilib yuboramiz
        paymentMethod: paymentMethod,
        totalPrice: Number(totalPrice), // ⚡ majburiy son
        baseCurrencyTotalPrice: Number(baseCurrencyTotalPrice),
        taxPrice: 0,
        shoppingPrice: 0,
        isPaid: isPaidInitially,
        paidAt: isPaidInitially ? new Date() : null,
        orderStatus: initialStatus
    });

    // OrderItem’larni yaratish
    await OrderItem.bulkCreate(
        itemsWithSellerInfo.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            sellerId: item.sellerId,
            qty: item.qty,
            price: item.price
        }))
    );

    // Create notifications using the enhanced notification system
    const uniqueSellerIds = [...new Set(itemsWithSellerInfo.map((item) => item.sellerId))];
    
    // Create order notifications for customer and sellers
    await Notification.createOrderNotification(order.id, req.user.id, uniqueSellerIds[0], 'order');
    
    // Additional notifications for multiple sellers if needed
    for (const sellerId of uniqueSellerIds) {
        await Notification.create({
            userId: sellerId,
            title: 'New Order Received',
            message: `You have received a new order #${order.id}. Payment method: ${paymentMethod}`,
            type: 'seller_notification',
            priority: 'high',
            relatedEntityType: 'order',
            relatedEntityId: order.id,
            link: `/seller/orders/${order.id}`,
            senderType: 'system',
            actions: [
                { label: 'View Order', action: 'navigate', url: `/seller/orders/${order.id}` },
                { label: 'Process Order', action: 'process', url: `/seller/orders/${order.id}/process` }
            ]
        });
        
        // Send real-time notification
        sendNotificationToUser(sellerId, {
            type: "new_order_for_seller",
            message: `You have received a new order #${order.id}`,
            orderId: order.id
        });
    }

    // Enhanced customer notification with multi-language support
    const orderMessages = {
        uz: {
            title: 'Buyurtma Tasdiqlandi',
            message: `Sizning #${order.id} raqamli buyurtmangiz muvaffaqiyatli qabul qilindi!`,
            payment: {
                cash: ' To\'lov: Naqd pul orqali',
                card: ' To\'lov: Bank kartasi orqali',
                online: ' To\'lov: Online to\'lov orqali'
            }
        },
        ru: {
            title: 'Заказ Подтвержден',
            message: `Ваш заказ #${order.id} успешно размещен!`,
            payment: {
                cash: ' Оплата: Наличными при доставке',
                card: ' Оплата: Картой при доставке',
                online: ' Оплата: Онлайн оплата завершена'
            }
        },
        en: {
            title: 'Order Confirmed',
            message: `Your order #${order.id} has been placed successfully!`,
            payment: {
                cash: ' Payment: Cash on delivery',
                card: ' Payment: Card on delivery',
                online: ' Payment: Online payment completed'
            }
        }
    };
    
    const messages = orderMessages[orderLanguage] || orderMessages['uz'];
    let userMessage = messages.message + messages.payment[paymentMethod];

    await Notification.create({
        userId: req.user.id,
        title: messages.title,
        message: userMessage,
        type: 'order',
        priority: 'high',
        relatedEntityType: 'order',
        relatedEntityId: order.id,
        link: `/orders/${order.id}`,
        senderType: 'system',
        actions: [
            { label: 'View Order', action: 'navigate', url: `/orders/${order.id}` },
            { label: 'Track Order', action: 'track', url: `/orders/${order.id}/track` }
        ],
        metadata: {
            paymentMethod: paymentMethod,
            totalPrice: totalPrice,
            itemCount: orderItems.length,
            currency: orderCurrency,
            language: orderLanguage
        },
        translations: {
            [orderLanguage]: {
                title: messages.title,
                message: userMessage
            }
        }
    });

    sendNotificationToUser(req.user.id, {
        type: "order_confirmed",
        message: userMessage,
        orderId: order.id,
        paymentMethod: paymentMethod
    });

    // Send SMS notification to user about order confirmation
    try {
        await smsService.sendSMSToUser(user, 'orderStatus', { orderNumber: order.id }, 'pending');
    } catch (smsError) {
        console.error('SMS yuborishda xatolik:', smsError);
        // SMS xatoligi buyurtma yaratishga ta'sir qilmasin
    }

    console.log("🟢 itemsWithSellerInfo:", itemsWithSellerInfo);
    console.log("🟢 totalPrice:", totalPrice);

    res.status(201).json(order);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: User, as: 'user', attributes: ['fullName', 'phoneNumber'] },
            {
                model: OrderItem,
                as: 'orderItems',
                include: [
                    { model: Product, as: 'orderedProduct', attributes: ['name', 'images'] },
                    { model: ProductVariant, as: 'orderedVariant', attributes: ['size', 'color', 'price', 'discountPrice'] },
                    { model: User, as: 'orderSeller', attributes: ['fullName', 'sellerInfo'] }
                ]
            }
        ]
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found.');
    }

    if (order.userId !== req.user.id && req.user.status !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to view this order.');
    }

    res.json(order);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Order not found.');
    }

    if (order.userId !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized to perform this action.');
    }

    // Agar buyurtma allaqachon to'langan bo'lsa
    if (order.isPaid) {
        res.status(400);
        throw new Error('Order is already paid.');
    }

    // Online to'lov uchun paymentResult majburiy
    if (order.paymentMethod === 'online' && !req.body.paymentResult) {
        res.status(400);
        throw new Error('Payment result is required for online payments.');
    }

    await order.update({
        isPaid: true,
        paidAt: new Date(),
        paymentResult: req.body.paymentResult || null,
        orderStatus: 'processing'
    });

    // Multi-language payment messages
    const paymentMessages = {
        uz: {
            title: 'To\'lov Tasdiqlandi',
            message: `Buyurtmangiz to'landi! Buyurtma ID: ${order.id}`,
            payment: {
                cash: ' (Naqd pul orqali)',
                card: ' (Bank kartasi orqali)',
                online: ' (Online to\'lov orqali)'
            }
        },
        ru: {
            title: 'Оплата Подтверждена',
            message: `Ваш заказ оплачен! ID заказа: ${order.id}`,
            payment: {
                cash: ' (Наличными)',
                card: ' (Банковской картой)',
                online: ' (Онлайн оплата)'
            }
        },
        en: {
            title: 'Payment Confirmed',
            message: `Your order has been paid! Order ID: ${order.id}`,
            payment: {
                cash: ' (Cash payment)',
                card: ' (Card payment)',
                online: ' (Online payment)'
            }
        }
    };
    
    const messages = paymentMessages[order.language] || paymentMessages['uz'];
    let paymentMessage = messages.message + messages.payment[order.paymentMethod];

    // Enhanced payment notification
    await Notification.create({
        userId: req.user.id,
        title: messages.title,
        message: paymentMessage,
        type: 'payment',
        priority: 'high',
        relatedEntityType: 'order',
        relatedEntityId: order.id,
        link: `/orders/${order.id}`,
        senderType: 'system',
        actions: [
            { label: 'View Order', action: 'navigate', url: `/orders/${order.id}` }
        ],
        metadata: {
            paymentMethod: order.paymentMethod,
            totalPrice: order.totalPrice,
            currency: order.currency,
            language: order.language
        },
        translations: {
            [order.language]: {
                title: messages.title,
                message: paymentMessage
            }
        }
    });

    sendNotificationToUser(req.user.id, {
        type: 'order_paid',
        message: paymentMessage,
        orderId: order.id,
        paymentMethod: order.paymentMethod
    });

    // Send SMS notification about payment confirmation
    try {
        const user = await User.findByPk(order.userId);
        const Currency = require('../models/Currency');
        const currency = await Currency.findByPk(order.currency);
        const formattedAmount = currency ? currency.formatAmount(order.totalPrice) : order.totalPrice;
        
        await smsService.sendSMSToUser(user, 'orderPayment', {
            orderNumber: order.id,
            amount: formattedAmount
        });
    } catch (smsError) {
        console.error('SMS yuborishda xatolik:', smsError);
        // SMS xatoligi to'lov tasdiqlanishiga ta'sir qilmasin
    }

    res.json({
        message: 'Order paid successfully',
        order: order
    });
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private (Admin or Seller)
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{ model: OrderItem, as: 'orderItems' }]
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found.');
    }

    const isAuthorizedSeller = order.orderItems.some(item => item.sellerId === req.user.id);
    if (req.user.status !== 'admin' && !isAuthorizedSeller) {
        res.status(401);
        throw new Error('Not authorized to perform this action.');
    }

    await order.update({
        isDelivered: true,
        deliveredAt: new Date(),
        orderStatus: 'delivered'
    });

    // Enhanced delivery notification
    await Notification.create({
        userId: order.userId,
        title: 'Order Delivered',
        message: `Your order #${order.id} has been delivered successfully!`,
        type: 'order_delivered',
        priority: 'high',
        relatedEntityType: 'order',
        relatedEntityId: order.id,
        link: `/orders/${order.id}`,
        senderType: 'system',
        actions: [
            { label: 'View Order', action: 'navigate', url: `/orders/${order.id}` },
            { label: 'Leave Review', action: 'review', url: `/orders/${order.id}/review` }
        ]
    });

    sendNotificationToUser(order.userId, {
        type: 'order_delivered',
        message: `Your order #${order.id} has been delivered!`,
        orderId: order.id
    });

    // Send SMS notification about order delivery
    try {
        const user = await User.findByPk(order.userId);
        await smsService.sendSMSToUser(user, 'orderStatus', { orderNumber: order.id }, 'delivered');
    } catch (smsError) {
        console.error('SMS yuborishda xatolik:', smsError);
        // SMS xatoligi delivery tasdiqlanishiga ta'sir qilmasin
    }

    res.json(order);
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
            {
                model: OrderItem,
                as: 'orderItems',
                include: [
                    { model: Product, as: 'orderedProduct', attributes: ['name', 'images'] },
                    { model: ProductVariant, as: 'orderedVariant', attributes: ['size', 'color'] }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private (Admin only)
const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        include: [
            { model: User, as: 'user', attributes: ['fullName', 'phoneNumber'] },
            {
                model: OrderItem,
                as: 'orderItems',
                include: [
                    { model: Product, as: 'orderedProduct', attributes: ['name', 'images'] },
                    { model: ProductVariant, as: 'orderedVariant', attributes: ['size', 'color', 'price', 'discountPrice'] },
                    { model: User, as: 'orderSeller', attributes: ['fullName', 'sellerInfo'] }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});

module.exports = {
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getAllOrders
};
