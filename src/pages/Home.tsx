import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faComment,
  faClipboard,
  faPenToSquare,
  faFolderOpen,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import HomeCard from '../components/HomeCard';

function Home() {
  const navigate = useNavigate();

  const menuOptions = [
    {
      title: 'Casos',
      icon: (
        <FontAwesomeIcon
          icon={faBook}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/casos',
    },
    {
      title: 'Citas Pendientes',
      icon: (
        <FontAwesomeIcon
          icon={faComment}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/citas-pendientes',
    },
    {
      title: 'Reportes e Indicadores',
      icon: (
        <FontAwesomeIcon
          icon={faClipboard}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/reportes',
    },
    {
      title: 'Solicitantes y Beneficiarios',
      icon: (
        <FontAwesomeIcon
          icon={faPenToSquare}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/solicitantes',
    },
    {
      title: 'Usuarios',
      icon: (
        <FontAwesomeIcon
          icon={faUsers}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/usuarios',
    },
    {
      title: 'Expedientes',
      icon: (
        <FontAwesomeIcon
          icon={faFolderOpen}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9rem] 2xl:text-[11rem]"
        />
      ),
      path: '/expedientes',
    },
  ];

  return (
    <MainLayout title="INICIO" className="p-8">
      {/* Grid de tarjetas - Ocupa todo el espacio disponible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full w-full px-2">
        {menuOptions.map((option, index) => (
          <HomeCard
            key={index}
            title={option.title}
            icon={option.icon}
            onClick={() => navigate(option.path)}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default Home;
