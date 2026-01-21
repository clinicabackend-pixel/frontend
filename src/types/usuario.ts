export interface Usuario {
    idUsuario: string;
    nombre: string;
    sexo: string;
    email: string;
    username: string;
    estatus: 'ACTIVO' | 'INACTIVO';
    tipoUsuario: 'ESTUDIANTE' | 'PROFESOR' | 'COORDINADOR' | 'ADMINISTRADOR';
    termino?: string;
    contrasena?: string;
}
