import './BackgroundAnimation.css'

export default function BackgroundAnimation() {
  return (
    <div className="bg-animation" aria-hidden="true">
      {/* Base gradient: blue left, red right */}
      <div className="bg-gradient-base" />
      {/* Blue-tinted fading lights (left side) */}
      <div className="bg-fade bg-fade-blue bg-fade-1" />
      <div className="bg-fade bg-fade-blue bg-fade-2" />
      <div className="bg-fade bg-fade-blue bg-fade-3" />
      <div className="bg-fade bg-fade-blue bg-fade-4" />
      {/* Red-tinted fading lights (right side) */}
      <div className="bg-fade bg-fade-red bg-fade-5" />
      <div className="bg-fade bg-fade-red bg-fade-6" />
      <div className="bg-fade bg-fade-red bg-fade-7" />
      <div className="bg-fade bg-fade-red bg-fade-8" />
      {/* Film strip at top */}
      <div className="bg-film-strip bg-film-strip-top" />
      {/* Film strip at bottom */}
      <div className="bg-film-strip bg-film-strip-bottom" />
    </div>
  )
}
