export type Collector = Model & {
	zone: Part;
	/** The visual representation when the collector is ready but not active. */
	Shell: Model & {
		PrimaryPart: Part;
		Button: Part & {
			ClickDetector: ClickDetector;
		};
	};
	Floor: Part;
	PrimaryPart: Part;
};
