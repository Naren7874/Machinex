import axios from 'axios';
import logger from '../utils/logger';

class WhatsAppService {
    private baseUrl = 'https://graph.facebook.com/v21.0';
    private token: string;
    private phoneNumberId: string;
    private isDevelopment: boolean;

    constructor() {
        this.token = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.isDevelopment = process.env.NODE_ENV === 'development';

        if (!this.token) {
            logger.warn('WHATSAPP_ACCESS_TOKEN is not set. WhatsApp messages will not be sent.');
        }
        if (!this.phoneNumberId) {
            logger.warn('WHATSAPP_PHONE_NUMBER_ID is not set. WhatsApp messages will not be sent.');
        }
    }

    /**
     * Send OTP via WhatsApp
     * In development mode with test number: Uses hello_world template + logs OTP
     * In production: Uses otp_verification template (requires approved template)
     */
    async sendOtp(phone: string, otp: string): Promise<boolean> {
        // Always log OTP in development for testing
        if (this.isDevelopment) {
            logger.info(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
        }

        if (!this.token || !this.phoneNumberId) {
            logger.warn('Skipping WhatsApp OTP: Missing credentials');
            return false;
        }

        try {
            const formattedPhone = phone.replace('+', '');

            // Use hello_world template for test numbers (always approved)
            // In production, you would use an approved OTP template
            const payload = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: {
                    name: 'hello_world', // Pre-approved template for testing
                    language: {
                        code: 'en_US',
                    },
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info(`✅ WhatsApp message sent to ${formattedPhone} (Message ID: ${response.data?.messages?.[0]?.id || 'unknown'})`);
            return true;

        } catch (error: any) {
            // Safe error logging
            const errorData = error.response?.data || error.message;
            logger.error('❌ WhatsApp API Error:', {
                message: error.message,
                status: error.response?.status,
                details: JSON.stringify(errorData)
            });
            return false;
        }
    }

    /**
     * Send a custom text message (requires 24-hour conversation window)
     */
    async sendText(phone: string, message: string): Promise<boolean> {
        if (!this.token || !this.phoneNumberId) {
            return false;
        }

        try {
            const formattedPhone = phone.replace('+', '');

            const payload = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: {
                    body: message,
                },
            };

            await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return true;
        } catch (error: any) {
            logger.error('WhatsApp Text Error:', error.response?.data || error.message);
            return false;
        }
    }
}

export default new WhatsAppService();
