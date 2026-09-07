export default function Placeholder({ title }) {
  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>Bu bölüm hazırlanıyor.</p>
        </div>
      </div>

      <div className="panel-card">
        {title} modülü bir sonraki blokta API'ye bağlanacak.
      </div>
    </div>
  );
}

