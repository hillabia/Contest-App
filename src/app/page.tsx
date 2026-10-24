export default function Home() {
  return <main style={{maxWidth:720,margin:"5rem auto",padding:"1rem",fontFamily:"sans-serif"}}>
    <h1>Contest App</h1>
    <p>Plataforma open source para concursos fotográficos.</p>
    <p><a href="/participar">Registrar una fotografía</a> · <a href="/galeria">Ver galería anónima</a> · <a href="/votar">Votar</a></p>
    <p>Versión en desarrollo. Para registrar participantes es necesario configurar un proyecto Supabase independiente y aplicar la migración. Votaciones, administración y eliminación aún no están implementadas.</p>
  </main>;
}
