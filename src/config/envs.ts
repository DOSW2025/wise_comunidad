import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    DATABASE_URL: string;
    DIRECT_URL?: string;
    JWT_SECRET: string;
}

const envsSchema = joi
    .object({
        PORT: joi.number().required(),
        DATABASE_URL: joi.string().required(),
        DIRECT_URL: joi.string().optional(),
        JWT_SECRET: joi.string().required(),
    })
    .unknown(true);

const result = envsSchema.validate(process.env);

if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value as EnvVars;

export const envs = {
    port: envVars.PORT,
    databaseurl: envVars.DATABASE_URL,
    directurl: envVars.DIRECT_URL,
    jwtSecret: envVars.JWT_SECRET,
};
