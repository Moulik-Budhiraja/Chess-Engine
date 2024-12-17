type CustomButtonProps = {
  variant?: "primary" | "secondary";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<CustomButtonProps> = ({
  variant = "primary",
  children,
  ...props
}) => {
  const variantClasses =
    variant === "primary"
      ? " border-2 border-slate-500 bg-slate-500 hover:bg-slate-700 hover:border-slate-700"
      : "border-2 border-slate-700 hover:bg-slate-700";

  return (
    <button
      className={`${variantClasses} text-white font-bold py-2 px-4 rounded transition-colors duration-200 ease-out`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
