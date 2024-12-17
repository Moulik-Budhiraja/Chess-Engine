export default function Arrow({ from, to }: { from: number; to: number }) {
  const fromRow = 7 - Math.floor(from / 8);
  const fromCol = from % 8;
  const toRow = 7 - Math.floor(to / 8);
  const toCol = to % 8;

  const dx = toCol - fromCol;
  const dy = toRow - fromRow;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const distance = Math.sqrt(dx * dx + dy * dy);

  const showDirect =
    !(Math.abs(dx) === 2 && Math.abs(dy) === 1) &&
    !(Math.abs(dx) === 1 && Math.abs(dy) === 2);

  return (
    <div className="absolute w-full h-full top-0 left-0 z-50 pointer-events-none">
      {/* Direct Arrow */}
      {showDirect && (
        <div
          className="absolute opacity-75 h-[0.825rem] z-50  flex justify-center pointer-events-none"
          style={{
            left: `${fromCol * 12.5 + 6.25}%`,
            top: `${fromRow * 12.5 + 6.25}%`,
            width: `${distance * 12.5}%`,
            translate: "0 -50%",
            rotate: `${angle}deg`,
            transformOrigin: "0 50%",
          }}
        >
          <div className="bg-[#f8ba36] fill-[#f8ba36]  w-[calc(100%-3rem)] mr-4 h-full relative">
            <svg
              className="absolute right-0 translate-x-full -translate-y-1/2 top-1/2 w-6"
              viewBox="0 0 80 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="0,0 80,50 0,100" />
            </svg>
          </div>
        </div>
      )}

      {/* Vertical then horizontal */}
      {Math.abs(dx) === 1 && Math.abs(dy) === 2 && (
        <div className="pointer-events-none opacity-75">
          <div
            className="absolute h-[0.825rem] z-50  flex justify-center"
            style={{
              left: `${fromCol * 12.5 + 6.25}%`,
              top: `${fromRow * 12.5 + 6.25}%`,
              width: `${Math.abs(dy) * 12.5}%`,
              rotate: `${(dy / Math.abs(dy)) * 90}deg`,
              translate: "0 -50%",
              transformOrigin: "0 50%",
            }}
          >
            <div className="bg-[#f8ba36] fill-[#f8ba36]  w-[calc(100%)] ml-5 h-full relative"></div>
          </div>
          <div
            className="absolute h-[0.825rem] z-50 flex justify-center"
            style={{
              left: `${fromCol * 12.5 + 6.25}%`,
              top: `${toRow * 12.5 + 6.25}%`,
              width: `${Math.abs(dx) * 12.5}%`,
              rotate: `${dx > 0 ? 0 : 180}deg`,
              translate: "0 -50%",
              transformOrigin: "0 50%",
            }}
          >
            <div className="bg-[#f8ba36] fill-[#f8ba36] -translate-x-[0.425rem] w-[calc(100%)] mr-6 h-full relative">
              <svg
                className="absolute right-0 translate-x-full -translate-y-1/2 top-1/2 w-6"
                viewBox="0 0 80 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="0,0 80,50 0,100" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal then vertical */}
      {Math.abs(dx) === 2 && Math.abs(dy) === 1 && (
        <div className="pointer-events-none opacity-75">
          <div
            className="absolute  h-[0.825rem] z-50  flex justify-center"
            style={{
              left: `${fromCol * 12.5 + 6.25}%`,
              top: `${fromRow * 12.5 + 6.25}%`,
              width: `${Math.abs(dx) * 12.5}%`,
              rotate: `${dx > 0 ? 0 : 180}deg`,
              translate: "0 -50%",
              transformOrigin: "0 50%",
            }}
          >
            <div className="bg-[#f8ba36] fill-[#f8ba36] w-[calc(100%)] ml-5 h-full relative"></div>
          </div>
          <div
            className="absolute  h-[0.825rem] z-50  flex justify-center"
            style={{
              left: `${toCol * 12.5 + 6.25}%`,
              top: `${fromRow * 12.5 + 6.25}%`,
              width: `${Math.abs(dy) * 12.5}%`,
              rotate: `${(dy / Math.abs(dy)) * 90}deg`,
              translate: "0 -50%",
              transformOrigin: "0 50%",
            }}
          >
            <div className="bg-[#f8ba36] fill-[#f8ba36] -translate-x-[0.425rem]  w-[calc(100%)] mr-6 h-full relative">
              <svg
                className="absolute right-0 translate-x-full -translate-y-1/2 top-1/2 w-6"
                viewBox="0 0 80 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="0,0 80,50 0,100" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
