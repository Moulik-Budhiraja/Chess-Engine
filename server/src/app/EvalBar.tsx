type Props = {
  evaluation: number;
  className?: string;
};

export default function EvalBar({ evaluation, className }: Props) {
  let height: number = 50;

  if (evaluation >= -450 && evaluation <= 450) {
    height += evaluation / 10;
  } else if (evaluation >= 100000) {
    height = 100;
  } else if (evaluation <= -100000) {
    height = 0;
  } else if (evaluation > 450) {
    height = 95;
  } else if (evaluation < -450) {
    height = 5;
  }

  let displayText = "";
  displayText = String(Math.abs(Math.round(evaluation / 10) / 10));

  if (Math.abs(evaluation) >= 100000) {
    displayText = `M${Math.floor((1000000 - Math.abs(evaluation)) / 2)}`;
  }

  return (
    <div className={"bg-gray-700 w-5 h-[32rem] " + className}>
      <div
        className="bg-gray-200 w-full bottom-0 absolute transition-all duration-300 ease-in-out"
        style={{ height: `${height}%` }}
      ></div>
      <div
        className={`absolute font-bold text-xs left-1/2 ${
          evaluation >= 0 ? "bottom-2 text-gray-700" : "top-2 text-gray-200"
        } -translate-x-1/2 `}
      >
        {displayText}
      </div>
    </div>
  );
}
