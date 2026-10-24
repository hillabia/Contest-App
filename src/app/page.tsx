export default function Home() {
 return <main style={{maxWidth:720,margin:"5rem auto",padding:"1rem",fontFamily:"sans-serif"}}>
 <h1>Contest App</h1><p>Plataforma open source para concursos fotográficos.</p>
 <nav><a href="/participar">Registrar fotografía</a> · <a href="/galeria">Galería anónima</a> · <a href="/votar">Votar</a> · <a href="/admin">Administración</a> · <a href="/podio">Podio</a></nav>
 <p>Versión en desarrollo. La publicación de resultados requiere autorización del administrador; el podio solo muestra concursos revelados.</p>
 </main>;
}