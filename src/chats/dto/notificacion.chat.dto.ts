import { IsBoolean, IsEmail, IsString } from "class-validator";

export class notificacionDto {
    template: string = TemplateNotificacionesEnum.NUEVO_MENSAJE;
    resumen: string;
    @IsEmail()
    email: string;
    @IsString()
    nombreGrupo: string;
    @IsBoolean()
    guardar: boolean = true;
    mandarCorreo: boolean = false;
};
export enum TemplateNotificacionesEnum {
    NUEVO_MENSAJE = "nuevoMensaje",
}