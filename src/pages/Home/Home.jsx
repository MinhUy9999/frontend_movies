
import MoviesShowing from "../MoviesShowing/MoviesShowing";
import MovieUpcoming from "../MovieUpcoming/MovieUpcoming";
const Home = () => {


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className=" w-full p-6 text-center">
                <h1 className="text-4xl font-bold mb-4">Chào mừng bạn đến với rạp phim của chúng tôi!</h1>
                <p className="text-gray-700 mb-6">Khám phá những bộ phim mới nhất và đặt vé ngay hôm nay!</p>
                <div className="text-5xl font-bold mb-4 text-start">Phim Đang Chiếu</div>
                <MoviesShowing />
                <div className="text-5xl font-bold mb-4 text-start">Phim Sắp Chiếu</div>
                <MovieUpcoming />
            </div>
        </div>
    );
};

export default Home;