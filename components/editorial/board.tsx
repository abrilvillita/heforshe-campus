const members = [
  {role:'Presidenta',name:'Camila Ugarte Alarcón',photo:'/team/camila-ugarte.jpg',links:[{label:'Instagram',url:'https://www.instagram.com/cam.ug_/'}]},
  {role:'Vicepresidenta',name:'Abril Miranda Villa Márquez',photo:'/team/abril-miranda.jpg',links:[{label:'Instagram',url:'https://www.instagram.com/abril_vill4/'},{label:'GitHub',url:'https://github.com/abrilvillita'},{label:'LinkedIn',url:'https://www.linkedin.com/in/abrilmirandavilla/'},{label:'Portafolio',url:'https://abrilvilla.dev/'}]},
  {role:'Eventos',name:'Camila Navarro Landeros',photo:'/team/camila-navarro.jpg',links:[{label:'Instagram',url:'https://www.instagram.com/camnavarro_/'}]},
  {role:'Redes',name:'Mia Ivana Pineda Briones',photo:'/team/mia-pineda.jpg',links:[{label:'Instagram',url:'https://www.instagram.com/artistfortune_fa/'}]},
  {role:'Tesorería',name:'Frida Nahomi Casas Perez',photo:'/team/frida-casas.jpg',links:[{label:'Instagram',url:'https://www.instagram.com/fridacssp/'}]},
];
export function BoardHero(){
  return <div className="board-hero"><img src="/team/grupo-formal.jpg" alt="Mesa directiva de HeForShe Laguna en su fotografía formal"/><h2>Mesa Directiva Generación 2026</h2></div>;
}
export function BoardSection(){
  return <section id="mesa-directiva" className="board-section" aria-labelledby="board-title"><div className="sectiontitle"><div><span className="eyebrow">EL EQUIPO DETRÁS DE ESTE ESPACIO</span><h2 id="board-title">Conoce a nuestra mesa directiva.</h2></div></div><img className="board-group" src="/team/grupo-amarillo.jpg" alt="Integrantes de HeForShe Laguna juntas durante una actividad con decoración amarilla"/><div className="board-grid">{members.map(member=><article className="board-card" key={member.name}><img className="board-portrait" src={member.photo} alt={'Retrato de '+member.name} loading="lazy"/><p className="board-role">{member.role}</p><h3>{member.name}</h3><div className="board-links">{member.links.map(link=><a href={link.url} key={link.label} target="_blank" rel="noopener noreferrer" aria-label={link.label+' de '+member.name}>{link.label} ↗</a>)}</div></article>)}</div><p className="board-credit">Página creada por <a href="https://abrilvilla.dev/" target="_blank" rel="noopener noreferrer">Abril Miranda Villa Márquez</a>.</p></section>;
}
