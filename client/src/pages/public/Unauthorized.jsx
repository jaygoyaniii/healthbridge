import PageTransition from '../../components/common/PageTransition';

const Unauthorized = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-h2 font-heading text-heading">Unauthorized — Coming Soon</h1>
      </div>
    </PageTransition>
  );
};

export default Unauthorized;
