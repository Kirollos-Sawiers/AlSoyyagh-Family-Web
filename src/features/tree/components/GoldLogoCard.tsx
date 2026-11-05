import logo from '../../../assets/alsoyyagh.jpg'

export function GoldLogoCard() {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-br from-[#dfc89d] via-[#c9a76d] to-[#99763d] shadow-[0_4px_14px_rgba(110,80,30,0.18)] border border-[#ebd8b6]/80 text-[#1f1a14] relative overflow-hidden group select-none">
      {/* Metallic specular sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-transparent pointer-events-none transition-transform duration-700 group-hover:translate-x-full" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40" />

      {/* Gold Seal Emblem */}
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.3)] border border-[#caa568]/50 bg-[#171007]">
        <img
          src={logo}
          alt="Al-Suyyagh emblem"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand & Line Details */}
      <div className="flex flex-col min-w-0">
        <h1
          className="text-[17px] font-bold text-[#231b12] leading-tight tracking-[-0.02em] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          The Al-Suyyagh Line
        </h1>
        <p className="text-[11px] font-medium text-[#463926] tracking-wide mt-0.5 opacity-90">
          Family archive · est. 1802
        </p>
      </div>
    </div>
  )
}

