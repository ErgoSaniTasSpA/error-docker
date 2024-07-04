import 'dotenv/config';
import * as joi from 'joi';
/* 
* Instalar 
* - npm i dotenv
* - npm i joi
* */

interface EnvVars {
    PORT             : number;
    NATS_SERVERS     : string[];
}

const envsSchema = joi.object({

    PORT             : joi.number().required(),
    NATS_SERVERS     : joi.array().items( joi.string() ).required()
})
.unknown(true) //! Acepta todas las propiedad, NO solo las validadas


const {error, value } = envsSchema.validate ({
    ...process.env,
    NATS_SERVERS : process.env.NATS_SERVERS?.split(',')
});

if ( error ) throw new Error(`Config Validation Error: ${ error.message }`);
  

const envVars: EnvVars = value;  

export const envs = {

    PORT             : envVars.PORT,
    NATS_SERVERS     : envVars.NATS_SERVERS,
}