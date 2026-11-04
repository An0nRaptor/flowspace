import { getEnv } from "../utils/get-env";

const appConfig=()=>({
    
    NODE_ENV:getEnv("NODE_ENV", "development"),
    PORT:getEnv("PORT","5000"),
    BASE_PATH:getEnv("BASE_PATH","/api"),
    MONGO_URL:getEnv("MONGO_URL",""),
    DNS_SERVERS:getEnv("DNS_SERVERS","none"),

    SESSION_SECRET:getEnv("SESSION_SECRET"),
    SESSION_EXPIRES_IN:getEnv("SESSION_EXPIRES_IN","1d"),

    GOOGLE_CLIENT_ID:getEnv("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET:getEnv("GOOGLE_CLIENT_SECRET"),
    GOOGLE_CALLBACK_URL:getEnv("GOOGLE_CALLBACK_URL"),

    FRONTEND_ORIGIN:getEnv("FRONTEND_ORIGIN", "localhost"),
    FRONTEND_GOOGLE_CALLBACK_URL:getEnv("FRONTEND_GOOGLE_CALLBACK_URL"),

    // Email reminders: leave SMTP_HOST unset ("none") to log emails instead of sending
    SMTP_HOST:getEnv("SMTP_HOST","none"),
    SMTP_PORT:getEnv("SMTP_PORT","587"),
    SMTP_USER:getEnv("SMTP_USER","none"),
    SMTP_PASS:getEnv("SMTP_PASS","none"),
    MAIL_FROM:getEnv("MAIL_FROM","FlowSpace <no-reply@flowspace.app>"),
    REMINDER_INTERVAL_MINUTES:getEnv("REMINDER_INTERVAL_MINUTES","15")
})



export const config = appConfig()