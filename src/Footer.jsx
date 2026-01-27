// src/Footer.jsx
function Footer() {
  return (
    <div style={{ 
      marginTop: '50px', 
      paddingTop: '20px', 
      borderTop: '1px solid #463714', 
      fontSize: '0.8rem', 
      color: '#666',
      width: '100%',
      paddingBottom: '20px'
    }}>
      <p style={{ margin: '5px 0' }}>
        Hecho con ⚡ y ☕ por <strong style={{color: '#C8AA6E'}}>Deyvi Ardila Forero</strong>
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <a 
          href="https://github.com/itsDeyvixd" 
          target="_blank" 
          rel="noreferrer" 
          style={{ color: '#0AC8B9', textDecoration: 'none', transition: 'color 0.3s' }}
          onMouseOver={(e) => e.target.style.color = '#fff'}
          onMouseOut={(e) => e.target.style.color = '#0AC8B9'}
        >
          GitHub
        </a>
        <span style={{ color: '#463714' }}>|</span>
        <a 
          href="https://www.linkedin.com/in/deyvi-ardila-forero-792154253/" 
          target="_blank" 
          rel="noreferrer" 
          style={{ color: '#0AC8B9', textDecoration: 'none', transition: 'color 0.3s' }}
          onMouseOver={(e) => e.target.style.color = '#fff'}
          onMouseOut={(e) => e.target.style.color = '#0AC8B9'}
        >
          LinkedIn
        </a>
      </div>
    </div>
  );
}

export default Footer;