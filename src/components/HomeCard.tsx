interface CardProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function HomeCard({ title, icon, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-full min-h-[200px] bg-linear-to-br from-gray-800 to-gray-900 border-2 border-red-900/30 rounded-2xl p-6 flex flex-col items-start justify-between hover:scale-[1.02] hover:shadow-2xl hover:border-red-900/50 transition-all duration-300 group overflow-hidden"
    >
      {/* Ícono decorativo (grande y con opacidad) */}
      <div className="absolute top-4 right-4 text-red-900/30 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
        {icon}
      </div>

      {/* Título */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-white font-bold text-xl md:text-2xl lg:text-3xl text-left uppercase tracking-wide">
          {title}
        </h3>
      </div>
    </button>
  );
}

export default HomeCard;
