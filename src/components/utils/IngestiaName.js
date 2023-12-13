import whiteLogo from "../../assets/logo-ingestia.png";
import blueLogo from "../../assets/logo-ingestia.png";
import { useTheme } from "@material-ui/core";

export function IngestiaName(props) {
  const { width, ...rest } = props;
  const theme = useTheme();

  return <div {...rest}>{theme.palette.type === "dark" ? <a href="/"><img style={{ width: width }} src={whiteLogo} alt="fireSpot" /></a> : <a href="/"><img style={{ width: width }} src={blueLogo} alt="fireSpot" /></a>}</div>;
}
