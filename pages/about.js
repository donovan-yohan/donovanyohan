import Nav from '../components/nav'
import Hero from '../components/hero'

const text = "Hi! I'm a gymnast, dancer, computer nerd, origami lover, bubble tea enthusiast, and more than just my work."

const About = () => (
  <div>
    <Nav />
    <Hero
      image={
        <div className="placeholder" />
      }
      text={text}
      customImageStyle={{
        margin: '0px'
      }}
    />
    <style jsx>{`
      .placeholder {
      border-radius: 100%;
        width: 400px;
        height: 400px;
        background-color: gray;
      }
    `}</style>
  </div>
)

export default About
