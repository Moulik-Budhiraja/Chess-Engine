type Props = {
  wins: number;
  losses: number;
  draws: number;
  className?: string;
};

export default function WinBar({ wins, losses, draws, className }: Props) {
  const total = wins + losses + draws;
  return (
    <div className={"bg-gray-700 w-5 h-[32rem] " + className}>
      {losses !== 0 && (
        <div
          className="bg-red-500 w-full transition-all duration-300 ease-in-out font-bold text-xs flex justify-center items-center"
          style={{ height: `${(losses / total) * 100}%` }}
        >
          {losses}
        </div>
      )}
      {draws !== 0 && (
        <div
          className="bg-gray-500 w-full transition-all duration-300 ease-in-out font-bold text-xs flex justify-center items-center"
          style={{ height: `${(draws / total) * 100}%` }}
        >
          {draws}
        </div>
      )}

      {wins !== 0 && (
        <div
          className="bg-green-500 w-full transition-all duration-300 ease-in-out font-bold text-xs flex justify-center items-center"
          style={{ height: `${(wins / total) * 100}%` }}
        >
          {wins}
        </div>
      )}
    </div>
  );
}
